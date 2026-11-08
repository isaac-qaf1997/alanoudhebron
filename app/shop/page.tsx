import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/session'
import { getStoreProducts } from '@/lib/queries'
import { cloudinaryImageUrl } from '@/lib/images'

export const metadata = {
  title: 'العنود للزي الشرعي | الخليل',
  description: 'العنود للزي الشرعي من الخليل — أثواب فلسطينية وعبايات وفساتين مطرزة.',
}

const socialLinks = [
  { href: 'https://www.facebook.com/Alanoudhebron/', label: 'فيسبوك', mark: 'f' },
  { href: 'https://www.instagram.com/alanoudhebron/', label: 'إنستغرام', mark: '◎' },
  { href: 'https://wa.me/970569388780', label: 'واتساب', mark: 'واتساب' },
]

const collageImage = 'data:image/webp;base64,UklGRtQaAABXRUJQVlA4IMgaAACwoACdASpoARgBPxl+tFUsp7AoqNVtAgAjCWNuQ0f34O1W+yqkNNLDvn6k8KKvNFus9mnt1xDMGRwRanazcoHm7fY/UJ/nPKdiA5kBxcHXuCBssh0UzHmBW78RaY0AUi7XLiojx2fVAaGhzYK9suMZv008xjs9y7FJnZwfPL595jnx0weamz9c6XI0DBbNhW6frxh+yDMlHi0pLxYyzmjPbA7YUnqeQoQUZ+ktz0vXiZ4+ppTaYqKJMrLrl4sgaEJrki7go8IU3isMkaCJ1AJV1U4u+M25dMX3W6hKYnCamq3SU1U/2puT646SjI7pGImVpw3V+fewWHozPvQLJ+YhA5ei9Mai0wOcm4I9AH3hy+7KUlDY0dB3ft9lyJGciLq6KeSgXQwuTBBcTa/Ekm/+iRAgYkWpJGUPA9bJ5dQEw2FNZ34J60AG77dPsXW1Jb60s4J5+2sRfWwacYHjopE6NrHoxJ756Ic/FNokq2TPuz8PHnZkAUPyIP8vHqcFdlH4OgDR66+TcGworldIEm1yALV+gKwzkLSJnrp6rPgPShITIAnVgdKVZzBZArl6EoiuRqZZVacMJQh6EzbEg3Kb9r6axmC/5mluoxLPqWErc/LdloyRE7QehfhxnBv2KBMs3pYVdT/TXeVtxX31bC2jO+SEskZFbxmUhYaIFICO4rVrtgJXChmin0OIf0Hu5gMpiPWKIVcijsg807C+H7clCiH7YBrCATqh9MUdB9Tk5oq0wHOKNpOM6GaPAYqMrJIV6W89qjsymrv+nJQ034aUM4X2KY6KgMgzJWJf71P/hENvYAI0PGVx7tMe0RiyU0jOEztFQJiG2+xqFdu/9Cm/750kU3bMe2MQ9ZJ6OQpPwLXObKHLszvKHVYyvu+hgnj9MGgaFG1lMIPAUMCFU9y0DV7/sFNNMJchk3+DnZ9GyqXIqxb4mVelNWWxgd+AHzIaEmnDcm0oyV1xRfmUvCw3aD4Hy8bt21rtZmfZaqOtJC9f7Muh6DBknmV0lc4Kjvem1TJJ3xUEE78zFmHcPmVE8MW9XxoPwo4hDc8maqy7LeDuD4OiatHsv5ETsQiwd1jSSSMO9M6V2cVsIRvjgud05sfEy/kopztZo8dMSHvkhua9PiqkbY/1+PrTFwNJFChnU1U4DDVUSDeZC+4G2S3ud4nXhgF3M9sfhSika3XF/1rE7cthRv9195lVGs3WVk9SobM2JCh5EBQCIgwEGSwjWUtZiFK4DxA9Vrm/mkai7SkZibmZD54+5tuT5oKwOnSBTqpuY9+17iA+VtYp4SqiBEAZzO9xfJkU6ien2CqDGoSB9/CVSYF2pe5KuWRdnrf6bbxWUctJzyjYJ5+jfel6LIU0SKvVbcrJn+JNMvt2WzDOYnaF/qTsqJVKhegfxEgp3+vXithr+5gi3ZORk1CJx6AYeaSdWl/eI/RRnSX+cAp/0a5irIPFuFczd89RNQYdoox2Lw+OxL6rDX6elP4crvbkdDPH74f9juz10tmwpRPrACOAVReAZv7VpHBoc0dU+j85rmdnkJyDFLh9iV0JH66G/U8FjLnhni13uZsVpl9U78Q/3uDlSJ/QVuv0Bjzrpdy4kE3VOPX40PMHChT4J7thidWcEAaXX830cJ9RuxSfAnPrUi2etghlL6FAH23qBSE87RGmt/6oeU9rmt0X4NZVHEq5IbjCLDXoOmPDJOg57Hg4GJFWLUrin2AAAP7m/c2de2JInmAAqj/2Wde6jLVuamFMKjdbqDTUfaYh82YMBRB5xH81B3scEd9xRSHWtsPzMYId51DRQQN9UzvSVsqzEZBdiS9USnJinBaxW/DvRx+gVWzfVrmRv9xMJH7ggQO3j+qtK65NRYXd7MRSPMwhb8y83qIvne8uuPVzP2+m6s0J1lLBOuVl510AG1jxuBrqpkejtV3U5Xt/mO7VDYpRrT4oBGxi2e5QVCVLst8xEWZ/DgDGXS6eHNWyK6yzXpnFn0WLxIBFrk968UWaBH2XwWL9QIrMnIxrY4VTZA1gAYKJoBVZPkIeoFKnUrdGTXQZcSGCL/qrLqlvbVJ0AeR507VEsHwfQrP19UkxTju8iXn/JtFV9XgsHsbGH/ydQfqY0vZ2mRYJINNRmkyFe2KDZo6KlNBvUiHX62PLzw3LnW3oiH7nMEX0LmQR7fRt/1zvkNh5wTLnrXmEM4NKFGD/d3vWrtptbD0Z4DJK+Dj4rMg0yB6jE39zO0AFZwkdafZoDKwYyERrjpwe+muJYQ5DwNs1tSSOIj61PCVEu2T0zgUofat/KSb5aNj/Rzk1d//wKdIfnNAnKxsTaSHK6fqJjtFF0CIfOdkUogZNGdqMbz+WY3PS6RCOxoHc71qxNGD04ZjDeoICdLbb7HQUvBJnR0OGWHuttH9p5tE5hZIwxvP2KSF13uV/TQCg2hftSYqeC2bw+OAMaJq9qegUNA4oK4q2h1VJ9YSplkPKHS/5aYLFNzu3PtRLdGal7RtaG0YhXma/v6NDqcl4ZH5GOrgq4np9AKPxhNOhrIWCJ/rD/hTiT5xAOLR/KK9v/pL/nb2L4J1Zz8sl1qno3BI2bDkVpwHRObSbso7Jl86pNO992SMeqGODCL67ARl3K0t6Vs4ftgC8x7fa5v9/pnS1TWe5c5JxUlKBQ9r3RzZ6un/1jAzDR645d4n7T1rFUrQu2YKe3azkaRXXkJJ1JXBIu6clLZQ8Onfq/4ZEWAYBFzOLkuXdOqVmTjslFrwcUqvkUieZQiDolplrvJbx74gkZRGcgeavHCLaOpfO/4wIbMev/P5D+QsIr5JmzSHp7ycfdGjIOJN6sWC/S1Qlrw0Mte7nId0yk2lP6ZXEGpCXO3Cz2ZhCDVOjHG6FerGlu38P8UswDrPqNwzw+DD6cumnYvflTJZg0m9oqrwPEBKA5UGiIIypsMd5yiPCrUxfDkaI8NDxYo20EFC5oM507MpCDTgL15T8ug/y3rRc5njP215sdAM/tkypHViBKZmCl5YhdNuKd4BEl/FzRB8gxt6xIbSpNCloBs/D4x4FX0YEkI50ouqFgjjA+I1a7/1L3P1rnIDzwOnO8SaA7FiGCusCNeNWwFjzetFk+rDLcexbm1KVtGnup3L8fLnTxmJ1IBZcb1LRFbvo+ZrDZsUqeTUdGFV9sWHvkxPuP2jZudlYiayLVKfRZ0Kocdpbv7Rgd3WS5AUZXSLfRodlUDHLHXWg0ajm/BZz/GCPy3hd1LN7Ey4uYKFo6+g5AAsXw+Mw3T/uKpfS1aEpEDX+RKLi9eMxqo1uMJpwlCkv/yQUNjazbcsc2Sxmwysqhyy4hwRTylgWFRINdI3k9A/RdgRSVHoQItEn6uNfAZk8lMu5zFIBc+qtdTK2g44rXLB2pDO5pXwefzdqpVmpNc1kqBwBylPuWpxWVomFcFunVR9h/RyJT9Kdmvc0R85hVcjoUo3qDlkU6JVJ9vWUI2X4ilraINQRAPoPaIIgTxjah9nn1D1+yJFrPjT56C65OA/P/otHplb0T534MOgBz6s2vG8MJEE9XZyGGuW+3c/dskyvvxVmeKJXyxvNcTZzloVZu3I/Nt6a8tOor795hqMUnC+qZX0gk05pK5Syiyba8LzrrL+zEv9QJ9E+LQbDDJIRY1D3LgNMH7RDkt15yXa4WATng8wDdqhx3aaUvDZ1AG5EHckYIAkQFuUrgSDkZgQab52M91tIjQ75MiYUjcZsn/i6XS2YVrzUNoiaW+CTDl2ourR6QbQM1fnAD5jLk0iLsaB0fUbjK2klquML2lBtGE8bXqn2lX1GPGt7k/8XUh+tEXnVOJooSS+fBrOfqDKS460SB4i78zmpdmAXTDfDFApmVfjdjVyNzdiAwKKKqOU9AVTGdl5j1bAziEMv95wIyhWs6ITJazuDbBUGM/b+mb5OqrS/0zoerWD6gVJ8uj4r4VaX+WqCeeiG+MMhpX59x5ataq2vknqK++v9loxoOi8Q/ETFdJT29UDQW7Z9nVc1wABZzeg/0k7wUUSWh2vFKBppAtpVJCTuR0PH7NKKH6aNd4EL60jd/qn/br7hvQDkq7v4VfzjQTQlaTPoDfZMPMKdf55Ztbus70IjwPnxWV4RmDRP9fJYv60nk67DBjiecxZSw9pSo3h1/+US0trgszPCeEy6BUPSEUqCjesQn+c0iPAqxBvmfkjolgBdNcbHBI64b4Qw0OjxqephFo30oSpIBilOopWk6Von/xqcPYVI6BT2wnS0VqCE2WZ26OFr2Kyt4jCVdDZYZ643/YJg2yg8gLCK+QJFlBHcEAsdvf+4lJRjxMA22LJAdb5XGG32ppBNJsxR20Mv7yCcdr1uoCNRONpRcKx70s+2vUPQrZtnVNxTfmb7r3V5Gyr3fvjtbEOIwj/bcFR1BIWX7eP/zS+JL/MnklJzoROrCwIks2IiaEsd69YynSbc5nfXNCiJuw1vWYUlutXvFs+5mbFP3awYI2SmtjM1u94FTfiscEWAMNsyFdYlcso97SApE7B3Y4W6ChANnzhTRubb4tH4kz1TNCZYb29oGVxfeMZhso4zTvYfCJoImGbJwgZkt1t4LfuIzxOs+jKQRQgc9Q71VwWTbWvPZnmzLxM9Mh29lN6L9wzpZc1wRcOinPFOp4PRj1Yni2+3dsct9ElxhMoJlWPkzOdP8EtR+LS2AMKfVyin8q7WN1jwqDuT7T+sXeGKM3DUlvnsqMC1kNSlT+8ckRh0sfgyTCbPkf8iFhSLnu0EywEMm//faq3fzX1pOLeYhVbCFzJDTmAMEsvCXfQH6oT1LwXhtCNNRJUWgT7h9zUu4Q5n1U8CeVhm6GowTkXJ+6PgtuqyzuwAmJbxLEim58WWH6+qDlrH5BzpiGKi0QMZ2pqVdilzwRC76eew+3mzdFBAll4lyHPp/U/F5pvMj46XBnTtJweCbKdwPQC38YavL5S4Keffm54OlIrdEUEFEnMgsO9pzJ+J5roljrQs5rv+o3ebNNjMnBfhTYUFRcbEwIYBFdLaR2pjfaZ904OkHt17L0q0qV73bK2DVoasVWdP/Owk5RBJBIc+QI5MOckw2/bbfgK3MX2Mzi0dXTSlZIDpEUm+3jIxy7tAWSSGgwqvFqq4zIPCnJyBKOjT6PhpOvCGBlVntaf0iNalP0l9TvOhy5fJBiNn4t80ZQj0OvrLAyuURqHtJBHU32OBUbpAiygrkL1CX/nNcoSBCSoBcOoojgmkNhsBU3BWmXnhSSemXGhivy77oZ8naFbiSrC0TKx0vfVHNR7UfFmcW+syA3zOL3ddz1lHQqJQivxVnLSoynv7TUmEyGPdbAWRmCVm+CH0uHXDhgRHYf6JfUA9UyOxWs3UkrBCKLz451wNV15kxEK9Mc5FlFWsv8unvgbm5LUDNP5nOIktR9pngGYOAiRyw91G09TudGxZpPGB0OcAaGrl4uYMQO9wvEMltBWTWTcKhU6qm24RbzeC6MgR0OBKGtgA7ewUezWCoamRrLZC/YfMlU4xip+kxag/mT96YkC70fZeBCO6SEB8MhVcE3o1iKsXec6evBDttEj9lWm/fwdcRpA+sRmX+bbV00lsmOgcCNT9r+/91P6tLrWSKQHarqGaSyT/krIG+oD4wxOgTx8XWwZtMai+b8GfhXF4CrKntCjzen4T/HYUYKRf6Vxrj9C69v6MOjIRAaqnDRKtwcy/DbRrAAe62sqpc0by3inRC66VcPT9dQpkq9Bmo7CJVKrrb81FuPBJgmyf1TuDSV5cxrguScGZN/qJx3kYxE3C0xQfeJ9hh2z0TMvPs0ApP2vDcae1OUVEpLIxrZkvajHVjJzOHGP4FOyv/l547VsvNYNOToPFmVCcAjr54YQ1nWM5fzb6Zg1vZzg+dpmhdIU1Jh045uLlo1DcLyuGN5JNvzW0tM5ZbYawunvl4OEGszBjJnGw9LNYiVWWoJOcR+OFQi6JSKJuYIMzQp0lkhVnAgIprVefx/T+TaCmdarZgEr3KVU83OFqsb6fRatOJEJurr8qdsghsU4hyD245XaleG1QyNFwypK+3TOA5cPjd3+GnMpy9mPvKxAFjSOEJYa+QPRZN9S/6c6Zft3hSVNMtNo9/iPSvNIPWGkewZW8Z+nCOh+ButxnKSAhDkQWD24ZfQ8pgGyMcGm7fk1iJUg8afKhl8oeqqR3ihCAU1noA9rQwHj1gRBHIDdkTs+8fZSMKiiqv/elu6Lun10GTjhxvbz44LDe2AC+69iOyie8AR0v/pk/vlQUfd23jAlclVgbLecg/e7bXz53/Ph9/jFG9738YaY9krYU6P3YOxYxE+XfcNFFex6Ei+hL0SJZrOuLeDmdeaU9ZOosbabmYRWd8V0o1GSQxmx7VdRIm20OB4eNKh/s+uxK3jeswtmkYbUVlE3nprO+Sj5kW+H6B6/fdV4WKmQDyf9IC6Houq6gLtXkW6huz4dvqWVxSe+HcGSo90mH5nYiFU6K0kXc541ySboRi4iJcYSgQfct0/KyYKudiZEDW+x77C8aFLMwGEqr30llku7tszkOAM4ToZrrMs7VV1Sacddfc1tAbgG9QY57c1V0M5wyOBP3ZQM4u3xGPdv4DDIuJGamX/YtplI8bqdWkpXq7LOCx1P7DSPUT+mMY7HYfaC+C7l6Jch323AYU5JK23cs3Kfjr6nKZ3DVwYn0V82HMnpjvyuoxhbxdPxdAFTbLpUQrGfS+++jB+dAMX/PDp9FHwPIwnTkIMrilJK8ZLl0+1beXv6nA7RpMQTO2dpNkun4Dv05wTuIaUEj6wyRGIzIl4OH/7Re2WMiJEHGbXxiur48U8OJPs3RterWrIGm483aGrZhmZOyCEfBmKUj0yn4x7i76RuLLeat7MBUaLmzLDIXvcwbTGhwQfvWFoMnRVHOi/3zql72cq7AO7SmgS7ZwMX+4tTGtKVGYujaaURhwSzQIgILhV76ScDqJxBaztfuB59wo5hXymmS1Wia6DHuqniad32doVN1/AIrWVbjbVoLWob7ufrEsFSIODsKNQ0HGQR4jTFEKYC4dDjKmY+aVa8PmSV4L7ASE5b6aHAnbMDavStKNHVMcxzOHwtctmmfpKXXutYke4VEhgX6fgC5IpKYNk9vGjuQC7pKXmnZCsslsqMhOj2k/pau+msPkNTuRSMP1rrwTFlWu+3d5XXz34yoT22KLviu92CpBNr2BzXancpP6Y5HogwUv9M0snF5SKyl8ExpuwLGP7EgwbBBUxwiGC4YN0deiVnREwnRWnM+0UJq6EcDwodjbozCiFa757lk2VwbTs43fuWOg9f4X1MyxMSn9Krbjy/G95dxkUoPjQZqak3epJNhuu6Qti5I8nLpAm2BRSGlPj0Cc+OXdcYL3/uNYlkGCW1oOHVou99o4f8iUvzvD/dC0DxJ+SYZyH0j9KdcG+UDYd19ZmV+7UxeR6cRwPmEp4mr078ikkz/wd+r9ua7piFO44EydkEX2CKeHhWGxkgYqunHcGkdGvDbi5PWLXz5FBznLs8bUOh1eeuyJqkq0JPj9KXLsM7j+Sg+hZVF6NjlP3O/19m+575T4Z8vs1YEBOg3+mqO3g5RN23aOxpZ2gcxWVcXFrA813dyG2SNEK3d8d0tF3alJQnQdF5iF3olchOh44Uas8V3UFsvZxFH2GS3ZuYIqO8JgKXxc36P9w/YrERBd3WImH5Vzg9KD0lOYotrqh1S1nAoxqshgNHyg5g9wRosTdgTSnxJ3G1iBZwWpcV8kvmB8VoJsgaRuoxVS6HXh8UKs4k8DJZrB8OrXVXywdgsKUZ7yENwW0vFi+AjObVOVDU+nkKxNBk9uSgblOrrdmxrajY6q9ZwABgythMfbjLBD5IceiAuWAqy8cI71I2535ywP/JwT8IqusP0hPclr6CMup87di2knNrbRjufVx23df3K+7WTaroKTzMhCEKDuoUGZ7cqqZCKbgMvkweEW+q58F/rrmB0ZzGIsAF4jO6lYrPr1Nlnt83pNB6i+VcN63+U8DFyhyVGHLuFnUC9etvuhA+oiu5SZQrqU1a4MHx0El3MgJicMjGLb34dc2vimQy9WS0982HgqMUB831vYjf9bPZc0vnZyrFaME52TBZDRDj4d3eC9c6Q1mdv6Lr+SNGc9Y4eP4qxdLZQLuwfCWVfKoOa2LMXqVk3IujmnEKy5fKmZkHFQH7PMnOhgMQHkd7uli/fzCb2kSo3xlOq54r+mAMKO3eu97jY/kEFIV7DEsAw2k20Dq8vwuE4DFtSw++ZB7HFWQ7ifRbDx/u0cSleNgST5FGjhCRhuk1stCXLBLrdwG8S9N8NNtTMEjxquPBSIb8iOYjaEiBfGg16odv0CuUQs6aJ8jhN1i+ShLHaqjL1ZqqYN1yX1dR/+OZR/3PoHT1py/w9lfHU7OQW1GKOr3OtmgE9/sfguDUYwFN9v3H9xJPv5tXPxFB0bTJbLMizUYkXCxPXz939QycwOJeyiTrY9fYkqYPIaMIlXuBwDVkyzMgyl0/c7Gx1atRaeBrJIksBBoUqY2MBbiEa3bzwyruY98anrm/YNOjXf/y88I7BoroRqNM5PaAkQFgZnCBmZ45lK0gQsAqmv2tWRf9GzfjS3T0vkxJVSMiXgx0TDfTRhNdYs7Q3TkxdjfkUtZ51PZFPUn6epAQA2getr7LYJKjBA9Hz7LmCiUDlni8Jmt70o/CWIoLXiFUg1/v6yVToQfTJgPYo4Zg20tYYH4ieuZbafwl35j5JGxx0aNoQKm/7gm+jaVz+zYhCe9iME7mr4AgZD58DNpI1mLA1xjj5FfRbMK+l8C+2GTUSKuL5Ft+etRiBYnnglZELxJwMfIy3nzMGDOrgwLZbWj1qacQWVEW8FVJuKz4t2jfHFkHH6J8EQPI0hwaHE8JnFFO1ekxiwiSl6xH3Vt301YBTAA50rh/VpXmqpDqv8ca92+92Bo6nXohnPYyAeLyvyRblgtWPnXywxO5/MCcgbItAz8ncghL2/CZZHVEI2CCp40f3IahpTn0an9MzaLVFSa326/HFokMxItGCZWT1WvhV+Wyo1seSCPmpwhsl2Jgrlp3kgaLDoUDHz5vj9SLduWzFFFwu1AglAdx8yUj6LJNT4xOYS/GQxnth+PGuH9y7SsyGgAAA'

function PhotoTile({ cell, className = '', label }: { cell: number; className?: string; label: string }) {
  // The supplied collage is arranged as 2 columns × 3 rows. Keep each original photo in its correct cell.
  const positions = ['0% 0%', '100% 0%', '0% 50%', '100% 50%', '0% 100%', '100% 100%']
  return <div role="img" aria-label={label} className={className} style={{ backgroundImage: `url(${collageImage})`, backgroundSize: '200% 300%', backgroundPosition: positions[cell], backgroundRepeat: 'no-repeat' }} />
}

function Logo() {
  return (
    <div aria-label="شعار العنود للزي الشرعي" role="img" className="h-[70px] w-[60px] shrink-0 rounded-xl border border-[#c5a46d] bg-black shadow-[0_5px_20px_rgba(40,30,18,.13)] sm:h-[82px] sm:w-[70px]" style={{ backgroundImage: `url(${collageImage})`, backgroundSize: '200% 300%', backgroundPosition: '0% 0%' }} />
  )
}

export default async function ShopPage() {
  const [userResult, productsResult] = await Promise.allSettled([getCurrentUser(), getStoreProducts()])
  const currentUser = userResult.status === 'fulfilled' ? userResult.value : null
  const products = productsResult.status === 'fulfilled' ? productsResult.value : []
  const available = products.map((product) => {
    const variants = product.colors.filter((color) => color.sizes.length
      ? color.sizes.some((size) => size.stock === null || size.stock > 0)
      : color.stock === null || color.stock > 0)
    return {
      ...product,
      imageUrl: cloudinaryImageUrl(variants.find((variant) => variant.imageUrl)?.imageUrl || product.imageUrl, 640),
      variants,
      stock: variants.reduce((sum, variant) => sum + (variant.sizes.length
        ? variant.sizes.reduce((n, size) => n + (size.stock ?? 1), 0)
        : (variant.stock ?? 1)), 0),
    }
  }).filter((product) => product.stock > 0)

  return (
    <main dir="rtl" className="min-h-dvh overflow-hidden bg-[#f8f5ef] text-[#29251f]">
      <div className="border-b border-[#8f6a39] bg-[#100c09] px-4 py-2 text-center text-[10px] tracking-wide text-[#e6d3ae] sm:text-xs">
        العنود للزي الشرعي · الخليل <span className="mx-2 text-[#bd9b62]">✦</span> أناقة من روح التراث
      </div>

      <header className="sticky top-0 z-30 border-b border-[#8f6a39]/70 bg-[#17110d]/95 text-[#f1d8ae] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-7">
          <nav className="flex items-center gap-3 text-xs text-[#e2c89e] sm:gap-6 sm:text-sm">
            <Link href="/shop" className="transition hover:text-[#a17b43]">الرئيسية</Link>
            <a href="#collections" className="hidden transition hover:text-[#a17b43] sm:inline">تشكيلاتنا</a>
            <a href="#products" className="transition hover:text-[#a17b43]">المنتجات</a>
            {currentUser?.role === 'admin' ? <Link href="/admin" className="hidden transition hover:text-[#a17b43] sm:inline">الإدارة</Link> : null}
          </nav>

          <Link href="/shop" aria-label="العنود للزي الشرعي" className="flex items-center gap-2.5">
            <Logo />
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-wide text-[#f1d8ae] sm:text-xl">العنود</span>
              <span className="mt-1 block text-[9px] font-semibold tracking-[.12em] text-[#c9a36b] sm:text-[11px]">للزي الشرعي · الخليل</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 text-[#8c6a3d]">
            <Link href="/cart" aria-label="السلة" className="rounded-full border border-[#8f6a39] p-2.5 text-[#f1d8ae] transition hover:bg-[#3b2a19]">♡</Link>
            <a href="https://wa.me/970569388780" aria-label="واتساب" className="hidden rounded-full bg-[#c99b5c] px-4 py-2.5 text-xs font-semibold text-[#21170e] transition hover:bg-[#e4c38e] sm:inline-flex">تواصلي معنا</a>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-[1500px] overflow-hidden bg-[#100b08] px-2 pb-8 pt-3 text-[#f8e8c8] sm:px-5 sm:pt-5">
        <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(ellipse at 12% 12%, #b88b4b 0, transparent 32%), radial-gradient(ellipse at 90% 85%, #9e6c32 0, transparent 28%)' }}/>
        <div className="relative overflow-hidden rounded-[1.4rem] border border-[#bd9457]/70 bg-[#100d0b] shadow-[0_25px_80px_rgba(0,0,0,.45)] sm:rounded-[2rem]">
          <div className="grid min-h-[620px] md:min-h-[690px] md:grid-cols-2">
            <div className="relative order-2 min-h-[420px] overflow-hidden md:order-1 md:min-h-[690px]">
              <PhotoTile cell={1} label="موديل شال أسود مطرز بالأحمر من أعمال العنود" className="absolute inset-0 h-full w-full bg-cover bg-[center_22%]"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#100b08]/80 via-transparent to-[#100b08]/10 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#100b08]/20"/>
              <div className="absolute bottom-5 left-5 rounded-full border border-[#e2c28d]/70 bg-[#17100bd9] px-5 py-2 text-xs tracking-wide text-[#f4dfb8] backdrop-blur-sm sm:bottom-8 sm:left-8">تطريز فلسطيني أصيل</div>
            </div>

            <div className="relative order-1 flex min-h-[470px] flex-col items-center justify-center overflow-hidden px-5 py-9 text-center md:order-2 md:min-h-[690px] md:px-9 lg:px-14">
              <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: "linear-gradient(180deg, rgba(13,9,6,.3), rgba(13,9,6,.88)), url('https://commons.wikimedia.org/wiki/Special:FilePath/Ibrahimi_mosque_-Hebron.jpg')" }}/>
              <div className="absolute inset-0 bg-gradient-to-b from-[#120d09]/20 via-[#120d09]/55 to-[#120d09]/95"/>
              <div className="relative flex flex-col items-center">
                <div className="mb-3 w-[118px] overflow-hidden rounded-2xl border border-[#d5ad6b]/80 bg-black shadow-[0_0_38px_rgba(205,163,94,.2)] sm:w-[140px]">
                  <PhotoTile cell={0} label="لوغو العنود الأصلي" className="aspect-[.83] w-full bg-black"/>
                </div>
                <p className="text-[2rem] font-semibold tracking-wide text-[#f2d29a] sm:text-4xl" style={{ fontFamily: 'Georgia, serif' }}>Al Anoud</p>
                <h1 className="mt-2 text-2xl font-bold text-[#f8e3bd] sm:text-3xl">العنود للزي الشرعي</h1>
                <div className="mt-4 flex w-full max-w-sm items-center gap-3 text-[#d9b475]">
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c69b5a]"/>
                  <span className="text-lg">✥ ❖ ✥</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c69b5a]"/>
                </div>
                <p className="mt-5 text-lg leading-relaxed text-[#f4dfbd] sm:text-xl">أناقتكِ من تراثنا ..<br/>وجمالكِ في تفاصيلنا</p>
                <div className="mt-4 text-3xl text-[#d7b477]">♡</div>
              </div>
            </div>
          </div>

          <div className="relative border-t border-[#c39a5d]/80 bg-[#15100d] px-3 pb-5 pt-6 sm:px-6 sm:pb-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#b58a4d]/10 to-transparent"/>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {[
                { title: 'عبايات', cell: 5 },
                { title: 'أثواب بناتي', cell: 3 },
                { title: 'فستان تطريز', cell: 4 },
                { title: 'أثواب', cell: 1 },
              ].map((item) => (
                <a key={item.title} href="#products" className="group relative overflow-hidden rounded-t-[48%] rounded-b-xl border border-[#d0a66a]/80 bg-[#201710] shadow-[0_7px_22px_rgba(0,0,0,.35)]">
                  <PhotoTile cell={item.cell} label={item.title} className="aspect-[.82] w-full bg-cover bg-center transition duration-500 group-hover:scale-[1.025]"/>
                  <div className="relative mx-auto -mt-1 w-[90%] rounded-full border border-[#e6c58f] bg-gradient-to-b from-[#f2d8a7] to-[#c99c5d] px-2 py-2 text-center text-sm font-bold text-[#1c140c] shadow-lg sm:text-base">{item.title}</div>
                </a>
              ))}
            </div>
          </div>

          <div className="relative border-t border-[#b88b50]/70 bg-[#100c09] px-4 pb-7 pt-5 text-center sm:px-8 sm:pt-7">
            <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 text-lg font-semibold text-[#f1d5a5] sm:text-xl">
              <span className="text-3xl text-[#d9b77d]">♧</span>
              <span>الدفع عند الاستلام</span>
            </div>
            <a href="#products" className="mx-auto mt-6 inline-flex min-h-14 items-center justify-center gap-3 rounded-full border-2 border-[#f1d29b] bg-gradient-to-b from-[#f5dfb6] to-[#c99b5c] px-10 text-lg font-bold text-[#1c140c] shadow-[0_5px_0_#8e642f,0_12px_28px_rgba(0,0,0,.35)] transition hover:-translate-y-0.5 sm:text-xl">
              <span>تسوّقي الآن</span><span className="text-2xl">🛒</span>
            </a>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="https://www.instagram.com/alanoudhebron/" target="_blank" rel="noreferrer" aria-label="إنستغرام" className="flex min-w-[135px] items-center justify-center gap-2 rounded-xl border border-[#d1aa70] px-4 py-2.5 text-xs text-[#f4dfbd] transition hover:bg-[#3b2a19]"><span className="text-xl">◎</span><span><span className="block text-[9px]">تابعونا على</span><span className="font-semibold">Instagram</span></span></a>
              <a href="https://www.facebook.com/Alanoudhebron/" target="_blank" rel="noreferrer" aria-label="فيسبوك" className="flex min-w-[135px] items-center justify-center gap-2 rounded-xl border border-[#d1aa70] px-4 py-2.5 text-xs text-[#f4dfbd] transition hover:bg-[#3b2a19]"><span className="text-2xl font-bold">f</span><span><span className="block text-[9px]">تابعونا على</span><span className="font-semibold">Facebook</span></span></a>
              <a href="https://wa.me/970569388780" target="_blank" rel="noreferrer" aria-label="واتساب" className="flex min-w-[135px] items-center justify-center gap-2 rounded-xl border border-[#d1aa70] px-4 py-2.5 text-xs text-[#f4dfbd] transition hover:bg-[#3b2a19]"><span className="text-xl">◉</span><span><span className="block text-[9px]">تواصلوا معنا</span><span className="font-semibold">WhatsApp</span></span></a>
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 h-2 w-full bg-gradient-to-r from-transparent via-[#c39a5d] to-transparent opacity-70"/>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 pb-8 sm:grid-cols-3 sm:px-7">
        <div className="flex items-center justify-center gap-3 rounded-xl border border-[#e9e0d4] bg-[#f2ece2] px-4 py-4 text-xs text-[#6e604e]"><span className="text-lg text-[#a17b48]">✧</span> تصاميم مختارة بعناية</div>
        <div className="flex items-center justify-center gap-3 rounded-xl border border-[#e9e0d4] bg-[#f2ece2] px-4 py-4 text-xs text-[#6e604e]"><span className="text-lg text-[#a17b48]">♡</span> الدفع عند الاستلام</div>
        <div className="flex items-center justify-center gap-3 rounded-xl border border-[#e9e0d4] bg-[#f2ece2] px-4 py-4 text-xs text-[#6e604e]"><span className="text-lg text-[#a17b48]">◇</span> الدفع المسبق متاح</div>
      </section>

      <section id="products" className="mx-auto max-w-7xl px-4 py-10 sm:px-7 sm:py-14">
        <div className="mb-7 flex items-end justify-between border-b border-[#e8dfd2] pb-4">
          <div><p className="text-[10px] font-semibold tracking-[.22em] text-[#a17b48]">THE LATEST</p><h2 className="mt-2 text-2xl font-semibold text-[#30271e]">تشكيلة العنود</h2></div>
          <span className="text-xs text-[#887d6d]">{available.length} منتج</span>
        </div>
        {available.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {available.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="group overflow-hidden rounded-2xl border border-[#e9e0d4] bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#6d5637]/10">
            <div className="aspect-[3/4] overflow-hidden bg-[#eee8de]">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center text-sm text-[#9a8b77]">صورة المنتج قريباً</div>}</div>
            <div className="p-3 sm:p-4"><h3 className="text-sm font-medium text-[#3b3329]">{product.name}</h3><p className="mt-2 font-semibold text-[#9a7444]">{product.price.toFixed(2)} ₪</p><p className="mt-1 text-[11px] text-[#988b79]">{product.variants.length} ألوان متاحة</p></div>
          </Link>)}
        </div> : <div className="border-y border-[#e6dccd] py-14 text-center"><Logo/><p className="mt-5 font-semibold text-[#514536]">تشكيلتنا الجديدة قريباً</p><p className="mt-2 text-sm text-[#928675]">ستظهر المنتجات هنا بعد إضافتها ونشرها من لوحة الإدارة.</p></div>}
      </section>

      <footer className="mt-8 bg-[#211d19] px-5 py-10 text-center text-sm text-[#e1d2b8]">
        <div className="mx-auto flex max-w-7xl flex-col items-center">
          <Logo/>
          <p className="mt-4 text-base font-semibold text-[#e5c991]">العنود للزي الشرعي</p>
          <p className="mt-1 text-xs text-[#b9aa91]">الخليل · فلسطين</p>
          <div className="mt-5 flex items-center justify-center gap-3">{socialLinks.map(({ href, label, mark }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-full border border-[#796344] px-3 py-2 text-xs text-[#e5c991] transition hover:bg-[#383025]">{mark}</a>)}</div>
          <Link href="/policies" className="mt-5 text-xs text-[#e5c991] underline underline-offset-4">سياسة التبديل والترجيع</Link>
        </div>
      </footer>
    </main>
  )
}
